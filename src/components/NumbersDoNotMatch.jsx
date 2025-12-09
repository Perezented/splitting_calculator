import { Container } from "react-bootstrap";

export const NumbersDoNotMatch = (props) => {
  const { totalAdded, totalAddedRounded, doNumbersMatch, posOrNeg } = props;

  return (
    <Container className="mb-50vh">
      {doNumbersMatch() === " text-danger" &&
        (totalAddedRounded - totalAdded).toFixed(2) !== "0.00" && (
          <div
            className={"my-5 blink" + posOrNeg(totalAddedRounded - totalAdded)}>
            <h4>
              Difference:
              {" " +
                (totalAddedRounded - totalAdded).toFixed(2) +
                " (" +
                (totalAddedRounded - totalAdded).toFixed(6) +
                ")"}
            </h4>
            {totalAddedRounded.toFixed(2) !==
              parseFloat(totalAdded).toFixed(2) && (
                <h3>
                  {totalAddedRounded.toFixed(2)} of the{" "}
                  <span className="text-white">
                    {parseFloat(totalAdded).toFixed(2)} original total
                  </span>{" "}
                  was used
                </h3>
              )}
          </div>
        )}
    </Container>
  );
};
